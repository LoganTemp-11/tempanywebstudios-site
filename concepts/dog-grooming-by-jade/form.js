/* Dog Grooming By Jade concept: the request form on find-and-book.
   Phase 2 of the build writes the behaviour (checks, concept-mode status line,
   the Web3Forms send). Until then the form works on the browser's own rules:
   method="dialog" sends nothing, and the required fields block an empty submit.

   Switching it on, in this order, once Jade says yes:
   1. Jade makes a Web3Forms access key on her Gmail.
   2. Set data-access-key on form#request and add the hidden access_key input.
   3. Set method="POST" and action="https://api.web3forms.com/submit".
   4. Add a hidden redirect input pointing at thanks on her own domain.
   5. Jade gives the retention line for the privacy page.
   6. Remove the not-live note (.form-note) and the concept status line.
   7. Send one real request end to end and check it reaches her inbox. */
