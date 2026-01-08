'use client';

import React, { useState } from 'react';
import Card from './Card';
import Button from '../Button';

export default function JoinClassCard() {
  const [classCode, setClassCode] = useState('');

  const handleJoinClass = () => {
    console.log('Joining class with code:', classCode);
    // Add your join class logic here
  };

  return (
    <Card className="bg-gradient-to-br from-skyBlue/10 to-skyBlue/5 border-skyBlue/20">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-skyBlue/20 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-skyBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-darkSlateBlue mb-1">Join a Class</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Enter the class code provided by your adviser to join a research class
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Class Code
              </label>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="Enter class code"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-transparent
                         text-sm placeholder:text-neutral-400"
              />
            </div>
            
            <Button
              variant="error"
              fullWidth
              onClick={handleJoinClass}
              className="bg-crimsonRed hover:bg-crimsonRed/90"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Join Class
            </Button>
          </div>
          
          <p className="text-xs text-neutral-500 mt-3">
            Don't have a class code? Contact your adviser to get an invitation.
          </p>
        </div>
      </div>
    </Card>
  );
}
