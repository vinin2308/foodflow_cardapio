import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['../login/login.scss', './forgot-password.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  emailSent = false;
  successMessage = '';
  floatingFoods: FloatingFood[] = [];
  
  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
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

  onSubmit(): void {
    if (this.forgotForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const forgotData = this.forgotForm.value;
      
      const forgotSub = this.authService.forgotPassword(forgotData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.emailSent = true;
          this.successMessage = response.message;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Erro ao enviar email. Tente novamente.';
        }
      });

      this.subscription.add(forgotSub);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.forgotForm.controls).forEach(key => {
        this.forgotForm.get(key)?.markAsTouched();
      });
    }
  }

  resendEmail(): void {
    this.emailSent = false;
    this.successMessage = '';
    this.errorMessage = '';
  }
}

