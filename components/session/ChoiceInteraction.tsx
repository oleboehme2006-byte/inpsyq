'use client';

interface Props {
    prompt: string;
    onSubmit: (value: string) => void;
    loading: boolean;
}

export default function ChoiceInteraction({ prompt, onSubmit, loading }: Props) {
    const handleSelect = (key: string) => {
        onSubmit(key);
    };

    return (
        <div className="flex flex-col space-y-8 w-full max-w-lg mx-auto p-4">
            <h2 className="text-xl md:text-2xl font-light text-center text-gray-200">
                {prompt}
            </h2>

            <div className="flex flex-col space-y-3">
                <button
                    onClick={() => handleSelect('A')}
                    disabled={loading}
                    className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-left transition-all disabled:opacity-50"
                >
                    <span className="font-bold text-blue-400 mr-2">A.</span>
                    Positive / High Control
                </button>
                <button
                    onClick={() => handleSelect('B')}
                    disabled={loading}
                    className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-left transition-all disabled:opacity-50"
                >
                    <span className="font-bold text-blue-400 mr-2">B.</span>
                    Neutral / Mixed
                </button>
                <button
                    onClick={() => handleSelect('C')}
                    disabled={loading}
                    className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-left transition-all disabled:opacity-50"
                >
                    <span className="font-bold text-blue-400 mr-2">C.</span>
                    Negative / Stress
                </button>
            </div>

            <p className="text-xs text-center text-gray-500">
                Select the option that best fits your current state.
            </p>
        </div>
    );
}
