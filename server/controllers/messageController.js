import imagekit from "../configs/imageKit.js";
import openai from "../configs/openai.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";

// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    // Check Credits
    if (req.user.credits < 1) {
      return res.json({
        success: false,
        message: "You don't have enough credits to use this feature",
      });
    }
    const { chatId, prompt } = req.body;
    const chat = await Chat.findOne({ userId, _id: chatId });
    chat.message.push({
      role: "User",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    const { choices } = await openai.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const reply = {
      ...choices[0].message,
      timestamp: Date.now(),
      isImage: false,
    };

    res.json({ success: true, reply });
    chat.message.push({
      role: "assistant",
      content: choices[0].message.content,
      timestamp: Date.now(),
      isImage: false,
    });

    await chat.save();
    await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Image Generation Message Controller
export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    // Check Credits
    if (req.user.credits < 2) {
      return res.json({
        success: false,
        message: "You don't have enough credits to use this feature",
      });
    }
    const { prompt, chatId, isPublished } = req.body;
    // Find Chat
    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) return res.json({ success: false, message: "Chat not found" });

    // Push User Messages
    chat.message.push({
      role: "User",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });
    const encodedPrompt = encodeURIComponent(prompt);
    const generatedImageUrl = `${
      process.env.ImageKit_URL_endpoint
    }/ik-genimg-prompt-${encodedPrompt}/mygpt/${Date.now()}.png?tr=w-800,h-800`;

    // Trigger Generation by fetching from ImageKit
    // const aiImageResponse = await axios.get(generatedImageUrl, {
    //   responseType: "arraybuffer",
    // });

    //Convert To Base64
    // const base64Image = `data:image/png;base64,${Buffer.from(
    //   aiImageResponse.data,
    //   "binary"
    // ).toString("base64")}`;

    // Upload to ImageKit Media Library
    const uploadResponse = await imagekit.upload({
      file: generatedImageUrl,
      fileName: `ai-image-${Date.now()}.png`,
      folder: "/quick-gpt-generated-images/",
    });

    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished,
    };
    res.json({ success: true, reply });
    chat.message.push(reply);
    await chat.save();
    await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
