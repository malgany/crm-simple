export function FormAutofillGuard() {
  return (
    <div aria-hidden="true" className="hidden">
      <input autoComplete="username" tabIndex={-1} type="text" />
      <input autoComplete="new-password" tabIndex={-1} type="password" />
    </div>
  );
}
