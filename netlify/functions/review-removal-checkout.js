const Stripe = require("stripe")

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { success: false, message: "Method not allowed" })
  }

  if (!stripeSecretKey) {
    return jsonResponse(500, {
      success: false,
      message: "Missing STRIPE_SECRET_KEY environment variable",
    })
  }

  try {
    const body = JSON.parse(event.body || "{}")
    const validationError = validatePayload(body)

    if (validationError) {
      return jsonResponse(400, { success: false, message: validationError })
    }

    const stripe = new Stripe(stripeSecretKey)

    const reviewCount = body.order.reviewCount
    const pricePerReview = body.order.pricePerReview || 350
    const unitAmount = Math.round(Number(pricePerReview) * 100)

    const successUrl = body?.payment?.confirmationUrl || "https://early-delivers-621747.framer.app/confirmation"
    const cancelUrl = body?.payment?.cancelUrl || "https://early-delivers-621747.framer.app/remove-negative-reviews"

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: (body?.order?.currency || "usd").toLowerCase(),
            product_data: {
              name: "Review Removal",
              description: `${reviewCount} review${reviewCount === 1 ? "" : "s"} submitted for removal`,
            },
            unit_amount: unitAmount,
          },
          quantity: reviewCount,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        businessName: truncate(body.customer.businessName, 500),
        contactName: truncate(body.customer.contactName, 500),
        email: truncate(body.customer.email, 500),
        phone: truncate(body.customer.phone, 500),
        reviewCount: String(reviewCount),
      },
      customer_email: body.customer.email,
    })

    return jsonResponse(200, {
      success: true,
      redirectUrl: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error("Stripe checkout error:", error)

    return jsonResponse(500, {
      success: false,
      message: error?.message || "Stripe session failed",
    })
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  }
}

function validatePayload(body) {
  if (!body || typeof body !== "object") return "Invalid JSON payload"

  const reviewLinks = Array.isArray(body.reviewLinks) ? body.reviewLinks.filter(Boolean) : []
  if (reviewLinks.length === 0) return "At least one review link is required"

  const hasInvalidLink = reviewLinks.some((link) => !isValidHttpUrl(link))
  if (hasInvalidLink) return "One or more review links are invalid"

  const customer = body.customer || {}
  if (!customer.businessName || String(customer.businessName).trim().length < 2) {
    return "Business name is required"
  }
  if (!customer.contactName || String(customer.contactName).trim().length < 2) {
    return "Contact name is required"
  }
  if (!isValidEmail(customer.email)) return "Valid email is required"
  if (!isValidPhone(customer.phone)) return "Valid phone number is required"

  const order = body.order || {}
  const reviewCount = Number(order.reviewCount)
  if (!Number.isInteger(reviewCount) || reviewCount < 1) {
    return "Valid reviewCount is required"
  }

  return null
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value))
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim())
}

function isValidPhone(value) {
  const digits = String(value || "").replace(/\D/g, "")
  return digits.length >= 7
}

function truncate(value, maxLength) {
  return String(value || "").slice(0, maxLength)
}
