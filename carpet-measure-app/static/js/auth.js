document.addEventListener('DOMContentLoaded', function() {
    // Password validation
    const password1Input = document.getElementById('password1');
    const password2Input = document.getElementById('password2');
    
    if (password1Input && password2Input) { // Only run on register page
        const requirements = {
            lengthReq: { regex: /.{8,}/, element: document.getElementById('lengthReq') },
            numberReq: { regex: /\d/, element: document.getElementById('numberReq') },
            specialReq: { regex: /[!@#$%^&*(),.?":{}|<>]/, element: document.getElementById('specialReq') },
            caseReq: { regex: /(?=.*[a-z])(?=.*[A-Z])/, element: document.getElementById('caseReq') }
        };

        function checkPasswordRequirements(password) {
            for (const [key, requirement] of Object.entries(requirements)) {
                if (requirement.element) { // Check if element exists
                    const passed = requirement.regex.test(password);
                    requirement.element.classList.toggle('requirement-passed', passed);
                    requirement.element.classList.toggle('requirement-failed', !passed);
                }
            }
        }

        function checkPasswordMatch() {
            const match = password1Input.value === password2Input.value;
            password2Input.classList.toggle('border-red-500', !match && password2Input.value);
            return match;
        }

        password1Input.addEventListener('input', function() {
            checkPasswordRequirements(this.value);
            this.classList.remove('error-field');
            const errorDiv = this.parentElement.querySelector('.field-error');
            if (errorDiv) errorDiv.remove();
        });

        password2Input.addEventListener('input', function() {
            checkPasswordMatch();
            this.classList.remove('error-field');
            const errorDiv = this.parentElement.querySelector('.field-error');
            if (errorDiv) errorDiv.remove();
        });
    }

    // Form submission handling
    const form = document.querySelector('form');
    if (form) {
        // Remove error messages when typing
        form.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error-field');
                const errorDiv = this.parentElement.querySelector('.field-error');
                if (errorDiv) errorDiv.remove();
            });
        });

        form.addEventListener('submit', function(e) {
            let hasErrors = false;
            const emptyFields = Array.from(this.elements)
                .filter(el => el.required && !el.value);

            // Remove all existing error messages first
            form.querySelectorAll('.field-error').forEach(el => el.remove());
            form.querySelectorAll('.error-field').forEach(el => el.classList.remove('error-field'));

            emptyFields.forEach(el => {
                hasErrors = true;
                el.classList.add('error-field', 'error-shake');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                errorDiv.textContent = `${el.previousElementSibling.textContent} is required`;
                el.parentElement.appendChild(errorDiv);
                setTimeout(() => el.classList.remove('error-shake'), 500);
            });

            if (password2Input && !checkPasswordMatch()) {
                hasErrors = true;
                password2Input.classList.add('error-field', 'error-shake');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                errorDiv.textContent = 'Passwords do not match';
                password2Input.parentElement.appendChild(errorDiv);
                setTimeout(() => password2Input.classList.remove('error-shake'), 500);
            }

            if (hasErrors) {
                e.preventDefault();
            }
        });
    }
}); 