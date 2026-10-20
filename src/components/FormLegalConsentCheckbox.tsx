const linkClass = "underline hover:text-foreground transition-colors";

/** Текст и ссылки — как в форме на главной (4 документа). */
export const FormLegalConsentText = () => (
  <>
    Я согласен(-на) с{" "}
    <a href="/privacy-policy/" target="_blank" rel="noopener noreferrer" className={linkClass}>
      политикой конфиденциальности
    </a>
    , с условиями{" "}
    <a href="/offer/" target="_blank" rel="noopener noreferrer" className={linkClass}>
      публичной оферты
    </a>
    , даю своё{" "}
    <a href="/privacy/" target="_blank" rel="noopener noreferrer" className={linkClass}>
      согласие на обработку персональных данных
    </a>{" "}
    и{" "}
    <a href="/advertising-consent/" target="_blank" rel="noopener noreferrer" className={linkClass}>
      согласие на получение рекламной рассылки
    </a>
  </>
);

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  className?: string;
};

const FormLegalConsentCheckbox = ({ checked, onChange, required, className = "" }: Props) => (
  <label
    className={`flex items-start gap-3 cursor-pointer text-[13px] text-muted-foreground leading-snug mt-1 ${className}`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 shrink-0 rounded border border-foreground/20 accent-primary"
      required={required}
    />
    <span>
      <FormLegalConsentText />
    </span>
  </label>
);

export default FormLegalConsentCheckbox;
