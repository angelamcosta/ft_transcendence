function cleanArea() {
  (document.getElementById('appArea') as HTMLDivElement | null)?.replaceChildren();
}

document.getElementById("signUp")?.addEventListener("click", () => {
  cleanArea();
  const form = document.createElement('form');
  form.id = 'myForm';

  // Create a text input
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.name = 'username';
  nameInput.placeholder = 'Enter your display name';
  nameInput.required = true;
  nameInput.classList.add('m-4','border','border-blue-500','text-blue-700','rounded','focus:outline-none','focus:ring-2','focus:ring-blue-500');

  // Create an email input
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.placeholder = 'Enter your email';
  emailInput.required = true;
  emailInput.classList.add('m-4','border','border-blue-500','text-blue-700','rounded','focus:outline-none','focus:ring-2','focus:ring-blue-500');

  // Create an email input
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.name = 'password';
  passwordInput.placeholder = 'Enter your pasword';
  passwordInput.required = true;
  passwordInput.classList.add('m-4','border','border-blue-500','text-blue-700','rounded','focus:outline-none','focus:ring-2','focus:ring-blue-500');

  // Create a submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Create account';
  submitBtn.classList.add('m-4','px-4','py-2','bg-blue-500','text-white','rounded','hover:bg-blue-700');

  // Append elements to form
  form.appendChild(nameInput);
  form.appendChild(document.createElement('br')); // Line break
  form.appendChild(emailInput);
  form.appendChild(document.createElement('br'));
  form.appendChild(passwordInput);
  form.appendChild(document.createElement('br'));
  form.appendChild(submitBtn);

  // Append form to the body (or a specific container)
  (document.getElementById('appArea') as HTMLDivElement | null)?.appendChild(form);

  // Handle form submission
  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault(); // Prevent actual form submission

    const formData = new FormData(form);
    const name = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const response = await fetch(document.baseURI + 'register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
  
      const data = await response.json();
      console.log('API response:', data);
  
      // Optional: show success message or redirect
      alert('Login successful!');
    } catch (error) {
      console.error('Error sending form data:', error);
      alert('Login failed!');
    }
  });
});

document.getElementById("signIn")?.addEventListener("click", () => {
    alert("Button clicked! Test com.");
  });