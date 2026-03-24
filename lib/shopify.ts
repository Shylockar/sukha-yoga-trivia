// ── Shopify token cache ───────────────────────────────────────────────────────

interface TokenCache {
  token: string;
  expiresAt: number; // ms epoch
}

let tokenCache: TokenCache | null = null;

export async function getShopifyToken(): Promise<string> {
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const now = Date.now();

  // Return cached token if still valid (expires in > 2h)
  if (tokenCache && tokenCache.expiresAt - now > TWO_HOURS_MS) {
    return tokenCache.token;
  }

  const domain = process.env.SHOPIFY_STORE_DOMAIN!;
  const clientId = process.env.SHOPIFY_CLIENT_ID!;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET!;

  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify token error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const expiresIn = (data.expires_in ?? 86400) * 1000; // default 24h
  tokenCache = { token: data.access_token, expiresAt: now + expiresIn };

  return tokenCache.token;
}

// ── Discount types ────────────────────────────────────────────────────────────

export type TriggerType =
  | "free_shipping"   // level up to intermediate (5000 pts)
  | "10off"           // 8000 pts
  | "15off"           // 12000 pts
  | "20off"           // level up to advanced (15000 pts)
  | "25off"           // 20000 pts
  | "15off_perfect";  // perfect game (repeatable)

interface DiscountConfig {
  codePrefix: string;
  valueType: "percentage" | "fixed_amount";
  value: string;
  targetType: "line_item" | "shipping_line";
  allocationMethod: "across" | "each";
  hoursValid: number;
  title: string; // human-readable for price rule title
}

const DISCOUNT_CONFIGS: Record<TriggerType, DiscountConfig> = {
  free_shipping: {
    codePrefix: "FREE",
    valueType: "percentage",
    value: "-100.0",
    targetType: "shipping_line",
    allocationMethod: "each",
    hoursValid: 48,
    title: "Sukha Envío Gratis – Nivel Intermedio",
  },
  "10off": {
    codePrefix: "10OFF",
    valueType: "percentage",
    value: "-10.0",
    targetType: "line_item",
    allocationMethod: "across",
    hoursValid: 48,
    title: "Sukha 10% OFF – 8.000 pts",
  },
  "15off": {
    codePrefix: "15OFF",
    valueType: "percentage",
    value: "-15.0",
    targetType: "line_item",
    allocationMethod: "across",
    hoursValid: 48,
    title: "Sukha 15% OFF – 12.000 pts",
  },
  "20off": {
    codePrefix: "20OFF",
    valueType: "percentage",
    value: "-20.0",
    targetType: "line_item",
    allocationMethod: "across",
    hoursValid: 48,
    title: "Sukha 20% OFF – Nivel Avanzado",
  },
  "25off": {
    codePrefix: "25OFF",
    valueType: "percentage",
    value: "-25.0",
    targetType: "line_item",
    allocationMethod: "across",
    hoursValid: 48,
    title: "Sukha 25% OFF – 20.000 pts",
  },
  "15off_perfect": {
    codePrefix: "PERF",
    valueType: "percentage",
    value: "-15.0",
    targetType: "line_item",
    allocationMethod: "across",
    hoursValid: 24,
    title: "Sukha 15% OFF Flash – Partida Perfecta",
  },
};

function randomSuffix(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ── Main function ─────────────────────────────────────────────────────────────

export interface CreatedDiscount {
  code: string;
  expiresAt: Date;
  triggerType: TriggerType;
  description: string;
  hoursValid: number;
}

// ── Customer lookup ───────────────────────────────────────────────────────────

async function findShopifyCustomerId(
  email: string,
  token: string,
  apiBase: string,
): Promise<number | null> {
  try {
    const res = await fetch(
      `${apiBase}/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`,
      { headers: { "X-Shopify-Access-Token": token } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const customer = data.customers?.[0];
    return customer ? Number(customer.id) : null;
  } catch {
    return null;
  }
}

export async function createDiscountCode(
  triggerType: TriggerType,
  email: string,
): Promise<CreatedDiscount> {
  const config = DISCOUNT_CONFIGS[triggerType];
  const domain = process.env.SHOPIFY_STORE_DOMAIN!;
  const token = await getShopifyToken();
  const apiBase = `https://${domain}/admin/api/2024-10`;

  const code = `SUKHA-${config.codePrefix}-${randomSuffix()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.hoursValid * 60 * 60 * 1000);

  // Look up Shopify customer to restrict code to that user
  const customerId = await findShopifyCustomerId(email, token, apiBase);
  const customerFields = customerId
    ? { customer_selection: "prerequisite", prerequisite_customer_ids: [customerId] }
    : { customer_selection: "all" };

  // 1. Create price rule
  const priceRuleRes = await fetch(`${apiBase}/price_rules.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      price_rule: {
        title: `${config.title} – ${code}`,
        target_type: config.targetType,
        target_selection: "all",
        allocation_method: config.allocationMethod,
        value_type: config.valueType,
        value: config.value,
        ...customerFields,
        starts_at: now.toISOString(),
        ends_at: expiresAt.toISOString(),
        usage_limit: 1,
        once_per_customer: true,
      },
    }),
  });

  if (!priceRuleRes.ok) {
    const text = await priceRuleRes.text();
    throw new Error(`Shopify price rule error ${priceRuleRes.status}: ${text}`);
  }

  const { price_rule } = await priceRuleRes.json();

  // 2. Create discount code under the price rule
  const discountCodeRes = await fetch(
    `${apiBase}/price_rules/${price_rule.id}/discount_codes.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ discount_code: { code } }),
    },
  );

  if (!discountCodeRes.ok) {
    const text = await discountCodeRes.text();
    throw new Error(`Shopify discount code error ${discountCodeRes.status}: ${text}`);
  }

  const description = buildDescription(triggerType);

  return { code, expiresAt, triggerType, description, hoursValid: config.hoursValid };
}

function buildDescription(triggerType: TriggerType): string {
  switch (triggerType) {
    case "free_shipping":
      return "Envío gratis en tu próxima compra en la tienda de Sukha.";
    case "10off":
      return "10% de descuento en toda la tienda de Sukha.";
    case "15off":
      return "15% de descuento en toda la tienda de Sukha.";
    case "20off":
      return "20% de descuento + envío gratis en la tienda de Sukha.";
    case "25off":
      return "25% de descuento + envío gratis en la tienda de Sukha.";
    case "15off_perfect":
      return "15% de descuento flash por tu partida perfecta en la tienda de Sukha.";
  }
}
