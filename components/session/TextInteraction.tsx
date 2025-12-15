'use client';

import { useState } from 'react';

interface Props {
    prompt: string;
    meta?: any;
    onSubmit: (value: string) => void;
    loading: boolean;
}

export default function TextInteraction({ prompt, meta, onSubmit, loading }: Props) {
    const [value, setValue] = useState('');

    return (
        <div className="flex flex-col space-y-8 w-full max-w-lg mx-auto p-4">
            <h2 className="text-xl md:text-2xl font-light text-center text-gray-200">
                {prompt}
            </h2>

            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Type your reflection here..."
                className="w-full h-32 p-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 transition-all resize-none"
                disabled={loading}
            />

            <button
                onClick={() => onSubmit(value)}
                disabled={loading || value.trim().length < 5}
                className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Submitting...' : 'Next'}
            </button>

            <p className="text-xs text-center text-gray-500">
                Minimum 5 characters.
            </p>
        </div>
    );
}
