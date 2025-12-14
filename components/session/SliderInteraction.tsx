'use client';

import { useState } from 'react';

interface Props {
    prompt: string;
    onSubmit: (value: string) => void;
    loading: boolean;
}

export default function SliderInteraction({ prompt, onSubmit, loading }: Props) {
    const [value, setValue] = useState(4); // Default to middle (1-7 scale)

    return (
        <div className="flex flex-col space-y-8 w-full max-w-lg mx-auto p-4">
            <h2 className="text-xl md:text-2xl font-light text-center text-gray-200">
                {prompt}
            </h2>

            <div className="flex flex-col space-y-4">
                <label className="text-center text-4xl font-bold text-blue-400">
                    {value}
                </label>

                <input
                    type="range"
                    min="1"
                    max="7"
                    step="1"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    disabled={loading}
                />

                <div className="flex justify-between text-xs text-gray-400 px-1">
                    <span>Strongly Disagree (1)</span>
                    <span>Strongly Agree (7)</span>
                </div>
            </div>

            <button
                onClick={() => onSubmit(String(value))}
                disabled={loading}
                className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Submitting...' : 'Next'}
            </button>
        </div>
    );
}
