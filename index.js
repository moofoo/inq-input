/* eslint-disable prettier/prettier */
const { createPrompt, useState, useKeypress } = require('@inquirer/core/hooks');
const { usePrefix } = require('@inquirer/core/lib/prefix');
const { isEnterKey, isBackspaceKey } = require('@inquirer/core/lib/key');
const chalk = require('chalk');

module.exports = createPrompt((config, done) => {
  const [status, setStatus] = useState('pending');
  let [defaultValue, setDefaultValue] = useState(config.default);

  const [populate] = useState(config.populate);

  const [errorMsg, setError] = useState();
  const [value, setValue] = useState(populate ? defaultValue : '');

  if (populate) {
    defaultValue = undefined;
  }

  const isLoading = status === 'loading';
  const prefix = usePrefix(isLoading);

  useKeypress(async (key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'pending') {
      return;
    }

    if (isEnterKey(key)) {
      const answer = value || defaultValue || '';
      setStatus('loading');
      const isValid = await config.validate(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus('done');
        done(answer);
      } else {
        setValue('');
        setError(isValid || 'You must provide a valid value');
        setStatus('pending');
      }
    } else if (isBackspaceKey(key) && !value) {
      setDefaultValue(undefined);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  const message = chalk.bold(config.message);
  let formattedValue = value;
  if (typeof config.transformer === 'function') {
    formattedValue = config.transformer(value, { isFinal: status === 'done' });
  }
  if (status === 'done') {
    formattedValue = chalk.cyan(formattedValue);
  }

  let defaultStr = '';
  if (defaultValue && status !== 'done' && !value) {
    defaultStr = chalk.dim(` (${defaultValue})`);
  }

  let error = '';
  if (errorMsg) {
    error = chalk.red(`> ${errorMsg}`);
  }

  return [`${prefix} ${message}${defaultStr} ${formattedValue}`, error];
});
