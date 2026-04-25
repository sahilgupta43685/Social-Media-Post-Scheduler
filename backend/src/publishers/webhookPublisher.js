const webhookPublisher = async (post) => {
  const webhookUrl = process.env.PUBLISH_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("Missing PUBLISH_WEBHOOK_URL for webhook mode");
  }

  const payload = {
    postId: post._id.toString(),
    platform: post.platform,
    content: post.content,
    scheduledTime: post.scheduledTime
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Webhook publish failed (${response.status}): ${bodyText}`);
  }

  return {
    mode: "webhook",
    externalPostId: `webhook_${post._id}_${Date.now()}`,
    rawResponse: bodyText
  };
};

module.exports = webhookPublisher;
