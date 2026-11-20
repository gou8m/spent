"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarClock, Gift, Wallet } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { DetailCard } from "@/components/transactions/add-parts";
import { ChoiceCard } from "@/components/recurring/choice-card";
import { useAmountField } from "@/hooks/use-amount-field";
import { decimalsForCurrency, formatMoney } from "@/lib/money";
import type { DayRule, RecurringFrequency } from "@/lib/recurrence";

export interface ScheduleValue {
  dayRule: DayRule;
  amountVaries: boolean;
  bonusOn: boolean;
  /** Plain number text in major units, like the amount boxes elsewhere. */
  bonusAmount: string;
  bonusEvery: string;
}

export const DEFAULT_SCHEDULE: ScheduleValue = { dayRule: "DAY", amountVaries: false, bonusOn: false, bonusAmount: "", bonusEvery: "3" };

export const DAY_RULE_LABELS: Record<DayRule, string> = {
  DAY: "Same date each month",
  MONTH_END: "Last day of the month",
  LAST_WORKING_DAY: "Last working day",
};

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly" };

export const looksLikeSalary = (title: string) => /\b(salary|payroll|wages?|stipend|pay ?cheque|pay ?check)\b/i.test(title);
/** Things whose amount is usually the same but now and then changes. */
export const looksLikeRent = (title: string) => /\b(rent|maintenance|emi|insurance|premium|subscription|bill)\b/i.test(title);

type Step = "day" | "amount" | "bonus" | "done";

/**
 * The questions about a repeating item's schedule, one at a time with a soft transition, then a one-line
 * summary that can be reopened: which day of the month, whether the amount stays the same or is confirmed
 * each time, and (for a monthly income) a repeating bonus. Used by the Recurring form and by the Repeat
 * card in a new transaction, so both ask the same things.
 */
export function ScheduleQuestions({
  type,
  title,
  frequency,
  startDate,
  currency,
  value,
  onChange,
  errors,
  open,
  initiallyDone = false,
}: {
  type: "EXPENSE" | "INCOME";
  title: string;
  frequency: RecurringFrequency;
  startDate: string;
  currency: string;
  value: ScheduleValue;
  onChange: (patch: Partial<ScheduleValue>) => void;
  errors: Record<string, string>;
  /** Questions start once there is something to ask about (a title). */
  open: boolean;
  initiallyDone?: boolean;
}) {
  const [step, setStep] = useState<Step>(initiallyDone ? "done" : "day");
  const monthly = frequency === "MONTHLY";
  const salary = type === "INCOME" && looksLikeSalary(title);
  const { attach, value: bonusText, onChange: onBonusChange } = useAmountField(value.bonusAmount, (v) => onChange({ bonusAmount: v }), currency);

  // Skip the day question for repeats that are not monthly, and the bonus for anything but monthly income.
  const shown: Step = !open ? "done" : step === "day" && !monthly ? "amount" : step === "bonus" && !(type === "INCOME" && monthly) ? "done" : step;

  const bonusMinor = Math.round(Number(value.bonusAmount) * 10 ** decimalsForCurrency(currency));
  const summary = [
    monthly ? DAY_RULE_LABELS[value.dayRule] : FREQUENCY_LABELS[frequency],
    value.amountVaries ? "Ask me each time" : "Same amount",
    ...(type === "INCOME" && monthly
      ? [value.bonusOn && value.bonusAmount ? `Bonus ${formatMoney(bonusMinor, currency)} every ${value.bonusEvery || "3"} months` : "No bonus"]
      : []),
  ].join(" · ");

  return (
    <>
      <Reveal show={shown === "day"}>
        {() => (
          <ChoiceCard
            icon={CalendarClock}
            title={salary ? "When does your salary arrive?" : "Which day of the month?"}
            hint={salary ? "Most people are paid on the last working day." : "Pick the rule that matches how it is charged."}
            value={value.dayRule}
            options={[
              { value: "DAY", label: "Same date each month", note: `the ${format(new Date(startDate), "do")}` },
              { value: "MONTH_END", label: "Last day of the month" },
              { value: "LAST_WORKING_DAY", label: "Last working day", note: "Mon to Fri" },
            ]}
            onPick={(v) => {
              onChange({ dayRule: v as DayRule });
              setStep("amount");
            }}
          />
        )}
      </Reveal>
      <Reveal show={shown === "amount"}>
        {() => (
          <ChoiceCard
            icon={Wallet}
            title={looksLikeRent(title) ? "Is the amount always the same?" : "Does the amount stay the same?"}
            hint={
              looksLikeRent(title)
                ? "Rent is mostly the same but changes now and then. Choose ask me to check each time."
                : "Ask me each time shows a prompt on the due date to confirm or change it."
            }
            value={value.amountVaries ? "ASK" : "SAME"}
            options={[
              { value: "SAME", label: "Always the same", note: "added automatically" },
              { value: "ASK", label: "Ask me each time", note: "confirm or change" },
            ]}
            onPick={(v) => {
              onChange({ amountVaries: v === "ASK" });
              setStep(type === "INCOME" && monthly ? "bonus" : "done");
            }}
          />
        )}
      </Reveal>
      <Reveal show={shown === "bonus"}>
        {() => (
          <ChoiceCard
            icon={Gift}
            title="Do you get a bonus?"
            hint="Many employers pay one every few months, on top of the regular amount."
            value={value.bonusOn ? "YES" : "NO"}
            options={[
              { value: "NO", label: "No bonus" },
              { value: "YES", label: "Yes, add a bonus" },
            ]}
            onPick={(v) => {
              onChange({ bonusOn: v === "YES" });
              if (v === "NO") setStep("done");
            }}
          />
        )}
      </Reveal>
      <Reveal show={shown === "bonus" && value.bonusOn}>
        {() => (
          <div className="rounded-[22px] bg-surface-2 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bonus-amount">Bonus amount</Label>
                <Input id="bonus-amount" inputMode="decimal" placeholder="0.00" ref={attach} value={bonusText} onChange={onBonusChange} error={!!errors.bonusAmount} />
              </div>
              <div>
                <Label htmlFor="bonus-every">Every (months)</Label>
                <Input
                  id="bonus-every"
                  inputMode="numeric"
                  value={value.bonusEvery}
                  onChange={(e) => onChange({ bonusEvery: e.target.value.replace(/[^0-9]/g, "") })}
                  error={!!errors.bonusEveryMonths}
                />
              </div>
            </div>
            <FieldError>{errors.bonusAmount || errors.bonusEveryMonths}</FieldError>
            <Button type="button" className="mt-3 w-full" onClick={() => setStep("done")} disabled={!value.bonusAmount || !value.bonusEvery}>
              Done
            </Button>
          </div>
        )}
      </Reveal>
      <Reveal show={open && shown === "done"}>
        {() => <DetailCard icon={CalendarClock} title="Schedule" hint={summary} onRemove={() => setStep("day")} removeLabel="Change" />}
      </Reveal>
    </>
  );
}
