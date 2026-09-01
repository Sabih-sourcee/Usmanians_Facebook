import React, { useState } from "react";

const BANK_NAME = "Easypaisa (Telenor Microfinance Bank)";
const ACCOUNT_HOLDER = "Atta Ur Rehman";
const ACCOUNT_NUMBER = "03132790207";

export const DonatePage: React.FC = () => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const copyValue = async (label: string, value: string) => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopyError("Could not copy. Please copy the details manually.");
    }
  };

  return (
    <div className="flex flex-col gap-md">
      <h2 className="text-headline-md text-on-surface">Donate us</h2>
      <p className="text-body-md text-on-surface-variant">
        Donate us for helping financially struggling children get education by
        this app and get themselves new books, school uniforms, and other
        accessories to make children able to get quality education for free.
      </p>

      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md space-y-md">
        <dl className="m-0 space-y-md">
          <div>
            <dt className="text-label-md text-on-surface-variant">Bank name</dt>
            <dd className="m-0 mt-xs text-body-md font-semibold text-on-surface">{BANK_NAME}</dd>
          </div>
          <div>
            <dt className="text-label-md text-on-surface-variant">Acc holder name</dt>
            <dd className="m-0 mt-xs text-body-md font-semibold text-on-surface">{ACCOUNT_HOLDER}</dd>
          </div>
          <div>
            <dt className="text-label-md text-on-surface-variant">Acc number</dt>
            <dd className="m-0 mt-xs text-headline-md font-bold text-primary tracking-wide">
              {ACCOUNT_NUMBER}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => void copyValue("account", ACCOUNT_NUMBER)}
          className="min-h-[44px] w-full rounded-lg bg-primary text-on-primary font-semibold cursor-pointer hover:bg-primary-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {copiedField === "account" ? "Account number copied" : "Copy account number"}
        </button>
        <button
          type="button"
          onClick={() =>
            void copyValue(
              "all",
              `Bank Name : ${BANK_NAME}\nAcc holder name : ${ACCOUNT_HOLDER}\nAcc number : ${ACCOUNT_NUMBER}`
            )
          }
          className="min-h-[44px] w-full rounded-lg bg-surface-container-highest text-on-surface font-semibold cursor-pointer hover:bg-surface-dim focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          {copiedField === "all" ? "Details copied" : "Copy all details"}
        </button>

        {copyError && (
          <p className="text-label-md text-error" role="alert">
            {copyError}
          </p>
        )}
      </div>
    </div>
  );
};
