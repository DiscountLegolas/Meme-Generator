import React, { useState } from "react";
import  ChatBot  from "react-chatbotify";
import { chat } from "../../services/api";
const MemeChatBot = () => {
  const [topic, setTopic] = useState('');
  const flow = {
    start: {
      message: "Hello I'm a Meme bot and ı will talk to you with memes.",
      function: (params) => setTopic(params.userInput),
      path: "get_topic",
    },
    writetopicagain:{
      message: "What Else do you wanna talk about",
      function: (params) => setTopic(params.userInput),
      path: "get_topic",
    },
    get_topic: {
      message: async (params) => {
				try {
          const chatResult = await chat(params.userInput || topic);
          return chatResult.chat; // expected meme URL from API
        } catch (error) {
          console.error("Error generating meme:", error);
          return "Error";
        }
			},
      transition: (params) => {
				return {duration: 0};
			},
      path: "writetopicagain",
    },
  };

  return (
    <ChatBot
      settings={{
        chatHistory: { storageKey: "meme_bot_chat_history" },
        tooltip:{mode:"NEVER"},
        chatButton:{icon:"https://res.cloudinary.com/dxfeqjihb/image/upload/v1758734977/undraw_chat-bot_c8iw_ff180b.svg"},
        chatHistory:{disabled:false},
        general:{primaryColor:"red",secondaryColor:"red"},
        notification:{disabled:true},
        header:{title:"Meme Bot",avatar:"https://res.cloudinary.com/dxfeqjihb/image/upload/v1758734977/undraw_chat-bot_c8iw_ff180b.svg"}
      }}
      flow={flow}
    />
  );
};

export default MemeChatBot;
