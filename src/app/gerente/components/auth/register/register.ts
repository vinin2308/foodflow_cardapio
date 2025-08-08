import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Subscription } from 'rxjs';

interface FloatingFood {
  name: string;
  image: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['../login/login.scss'] // Reusing login styles
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  floatingFoods: FloatingFood[] = [];
  
  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.initializeFloatingFoods();
    this.startFoodAnimation();
    
    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Remove the passwordMismatch error if passwords match
      if (confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    
    return null;
  }

  initializeFloatingFoods(): void {
    const foodImages = [
      { name: 'burger', image: 'assets/images/food-icons/burger.png' },
      { name: 'pizza', image: 'assets/images/food-icons/pizza.png' },
      { name: 'coffee', image: 'assets/images/food-icons/coffee.png' },
      { name: 'donut', image: 'assets/images/food-icons/donut.png' },
      { name: 'taco', image: 'assets/images/food-icons/taco.png' }
    ];

    // Create multiple instances of each food item
    for (let i = 0; i < 15; i++) {
      const food = foodImages[Math.floor(Math.random() * foodImages.length)];
      this.floatingFoods.push({
        name: food.name,
        image: food.image,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 12 // 8-20 seconds
      });
    }
  }

  startFoodAnimation(): void {
    // Update positions periodically
    setInterval(() => {
      this.floatingFoods.forEach(food => {
        food.x = Math.random() * window.innerWidth;
        food.y = Math.random() * window.innerHeight;
        food.delay = Math.random() * 2;
        food.duration = 8 + Math.random() * 12;
      });
    }, 10000); // Update every 10 seconds
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const registerData = this.registerForm.value;
      
      const registerSub = this.authService.register(registerData).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Erro ao criar conta. Tente novamente.';
        }
      });

      this.subscription.add(registerSub);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
}

