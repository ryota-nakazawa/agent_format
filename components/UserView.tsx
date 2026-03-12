"use client";
import React from "react";
import Chat from "./Chat";
import useConversationStore from "@/stores/useConversationStore";
import { Item, processMessages } from "@/lib/assistant";
import { CUSTOMER_DETAILS } from "@/config/demoData";

export default function UserView() {
  const {
    chatMessages,
    addConversationItem,
    addChatMessage,
    activeInquiryId,
    setActiveInquiryId,
  } =
    useConversationStore();

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userItem: Item = {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: message.trim() }],
    };
    const userMessage: any = {
      role: "user",
      content: message.trim(),
    };

    try {
      addConversationItem(userMessage);
      addChatMessage(userItem);
      const inquiryResponse = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiryId: activeInquiryId,
          customerId: CUSTOMER_DETAILS.id,
          customerName: CUSTOMER_DETAILS.name,
          userMessage: message.trim(),
        }),
      }).then((res) => res.json());

      if (inquiryResponse?.id) {
        setActiveInquiryId(inquiryResponse.id);
      }

      await processMessages();
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  return (
    <div className="flex-1 w-full bg-white rounded-lg p-4 overflow-hidden">
      <Chat
        items={chatMessages}
        view="user"
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
