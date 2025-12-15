'use client';

interface Props {
    prompt: string;
    meta?: any;
    onSubmit: (value: string) => void;
    loading: boolean;
}

export default function ChoiceInteraction({ prompt, meta, onSubmit, loading }: Props) {
    const choices = meta?.choices || [
        "Positive / High Control",
        "Neutral / Mixed",
        "Negative / Stress"
    ];

    const labels = ["A", "B", "C", "D", "E", "F"];

    const handleSelect = (text: string) => {
        // Send the FULL text so Interpreter can analyze it
        onSubmit(text);
    };

    return (
        <div className="flex flex-col space-y-8 w-full max-w-lg mx-auto p-4">
            <h2 className="text-xl md:text-2xl font-light text-center text-gray-200">
                {prompt}
            </h2>

            <div className="flex flex-col space-y-3">
                {choices.map((choice: string, idx: number) => (
                    <button
                        key={idx}
                        onClick={() => handleSelect(choice)}
                        disabled={loading}
                        className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-left transition-all disabled:opacity-50 flex items-start"
                    >
                        <span className="font-bold text-blue-400 mr-2 mt-0.5">{labels[idx] || idx + 1}.</span>
                        <span className="text-slate-200">{choice}</span>
                    </button>
                ))}
            </div>

            <p className="text-xs text-center text-gray-500">
                Select the option that best fits your current state.
            </p>
        </div>
    );
}
