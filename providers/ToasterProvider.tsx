"use client";
import React from "react";
import { Toaster } from "react-hot-toast";

const ToasterProvider = () => {
  return (
    <Toaster
      toastOptions={{
        style: {
          backgroundColor: "black",
          color: "white",
        },
      }}
    />
  );
};

export default ToasterProvider;
