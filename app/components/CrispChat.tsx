"use client"

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

// Create the actual component that initializes Crisp
const CrispChat = () => {
  useEffect(() => {
    // Configure Crisp with your website ID
    Crisp.configure("bc77d2f3-5e83-4694-991d-100f2c7c1b78");
    
    // Use default positioning (bottom right)
    window.$crisp = [];
    window.$crisp.push(["safe", true]);
    
  }, []);

  return null;
};

export default CrispChat;
