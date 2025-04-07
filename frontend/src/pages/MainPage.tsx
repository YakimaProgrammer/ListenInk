import React from "react";
import { Link } from "react-router-dom";

const MainPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-lg text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to ListenInk</h1>
        <p className="text-gray-600 mb-6">
          Upload your PDFs and listen to them with ease. Enhance your learning experience with audio.
        </p>
        <div className="mt-4">
          <Link to="/login" className="text-blue-500 hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
