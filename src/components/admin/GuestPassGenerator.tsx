import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const durationOptions = [
  { label: 'Minute(s)', value: 'minutes' },
  { label: 'Hour(s)', value: 'hours' },
];

function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function GuestPassGenerator() {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<'minutes' | 'hours'>('minutes');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const handleGenerate = async () => {
    console.log('🚀 DEBUG [HANDLER]: Stripped down generator initiated...');
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Directly force the text link onto the screen before even awaiting the database
    setGeneratedLink(`${window.location.origin}/watch/${randomCode}`);

    try {
      const { error } = await supabase
        .from('guest_passes')
        .insert([
          {
            pass_code: randomCode,
            expires_at: new Date(Date.now() + 3600000).toISOString(),
          },
        ]);

      if (error) {
        console.error('❌ DB WRITE FAILED BUT LINK CREATED:', error.message);
      } else {
        console.log('✅ SYSTEM PASS SYNCHRONIZED:', randomCode);
      }
    } catch (err) {
      console.error('Caught error:', err);
    }
  };

  return (
    <section className="mb-8 rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Guest Pass Generator</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create a time-locked access link for the read-only watch portal.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Duration
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Unit
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value as 'minutes' | 'hours')}
                className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex min-w-[170px] items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
          >
            Generate Link
          </button>
        </div>

        {statusMessage && (
          <div className="rounded-2xl bg-emerald-950/95 px-4 py-3 text-sm text-emerald-200">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl bg-rose-950/95 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        )}
      </div>
    </section>
  );
}
