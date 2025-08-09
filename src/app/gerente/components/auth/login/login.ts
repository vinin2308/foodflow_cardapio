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
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  floatingFoods: FloatingFood[] = [];
  
  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
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

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginData = this.loginForm.value;
      
      const loginSub = this.authService.login(loginData).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Erro ao fazer login. Tente novamente.';
        }
      });

      this.subscription.add(loginSub);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}

