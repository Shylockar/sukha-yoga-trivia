import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createDiscountCode, TriggerType } from "@/lib/shopify";
import { sendCouponEmail } from "@/lib/email";

// Triggers that can be earned only once per user
const ONE_TIME_TRIGGERS: TriggerType[] = [
  "free_shipping",
  "10off",
  "15off",
  "20off",
  "25off",
];

export async function POST(req: NextRequest) {
  try {
    const { email, triggerType, userName } = await req.json();

    if (!email || !triggerType) {
      return NextResponse.json(
        { error: "email y triggerType requeridos" },
        { status: 400 }
      );
    }

    const isOneTime = ONE_TIME_TRIGGERS.includes(triggerType as TriggerType);

    // Check if user already received this one-time reward
    if (isOneTime) {
      const rewardsKey = `rewards:${email}`;
      const alreadyGiven = await redis.hget(rewardsKey, triggerType);
      if (alreadyGiven) {
        return NextResponse.json(
          { error: "Premio ya otorgado", alreadyGiven: true },
          { status: 409 }
        );
      }
    }

    // Generate Shopify discount code (pass email for customer restriction)
    const discount = await createDiscountCode(triggerType as TriggerType, email);

    // Persist reward in Redis (one-time only)
    if (isOneTime) {
      await redis.hset(`rewards:${email}`, { [triggerType]: discount.code });
    }

    // Send coupon email — fire-and-forget, don't block on failure
    sendCouponEmail({
      to: email,
      userName: userName ?? email,
      code: discount.code,
      description: discount.description,
      expiresAt: discount.expiresAt.toISOString(),
      validHours: discount.hoursValid,
    }).catch((err) => console.error("[/api/coupon] email send failed:", err));

    return NextResponse.json({
      code: discount.code,
      expiresAt: discount.expiresAt.toISOString(),
      description: discount.description,
      triggerType: discount.triggerType,
      hoursValid: discount.hoursValid,
    });
  } catch (err) {
    console.error("[/api/coupon] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
