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

  const handleGenerate = async () => {
    setErrorMessage('');
    setStatusMessage('');

    const count = Number(quantity);
    if (!count || count < 1) {
      setErrorMessage('Please enter a duration of at least 1.');
      return;
    }

    console.log('🚀 DEBUG [HANDLER]: Stripped down generator initiated...');

    const randomCode = generateSixDigitCode();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + (unit === 'hours' ? count * 60 * 60 * 1000 : count * 60 * 1000)
    );
    const fullLink = `${window.location.origin}/watch/${randomCode}`;

    setGeneratedLink(fullLink);
    setStatusMessage(`Guest pass generated locally. Expires at ${expiresAt.toISOString()}`);

    try {
      const { error } = await supabase.from('guest_passes').insert([
        {
          pass_code: randomCode,
          expires_at: expiresAt.toISOString(),
        },
      ]);

      if (error) {
        console.error('❌ DB WRITE FAILED BUT LINK CREATED:', error.message || error);
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

        {generatedLink && (
          <div className="rounded-2xl bg-slate-900/95 px-4 py-3 text-sm text-slate-100">
            <div className="font-semibold text-white">Generated Watch Link</div>
            <div className="mt-2 break-words text-sky-300">{generatedLink}</div>
          </div>
        )}

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
