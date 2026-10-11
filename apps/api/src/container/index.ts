/**
 * Centralized Dependency Injection Container & Singleton Registry
 * Follows Gang of Four (GoF) Singleton & Inversion of Control (IoC) Patterns.
 * Ensures persistent connections, zero redundant instance allocations, and centralized lifecycle management.
 */

import { AuthRepository } from '../modules/auth/auth.repository';
import { AuthService } from '../modules/auth/auth.service';
import { UsersRepository } from '../modules/users/users.repository';
import { UsersService } from '../modules/users/users.service';
import { SocialAccountsRepository } from '../modules/social-accounts/social-accounts.repository';
import { SocialAccountsService } from '../modules/social-accounts/social-accounts.service';
import { PostsRepository } from '../modules/posts/posts.repository';
import { PostsService } from '../modules/posts/posts.service';
import { BillingRepository } from '../modules/billing/billing.repository';
import { BillingService } from '../modules/billing/billing.service';
import { MediaRepository } from '../modules/media/media.repository';
import { MediaService } from '../modules/media/media.service';
import { NotificationsRepository } from '../modules/notifications/notifications.repository';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { AiContentService } from '../modules/ai-content/ai-content.service';
import { DataRetentionService } from '../services/data-retention.service';
import { CashfreeProvider } from '../modules/billing/providers/cashfree.provider';
import { RazorpayProvider } from '../modules/billing/providers/razorpay.provider';

import { AuditLogService } from '../services/audit-log.service';

class Container {
  private static instance: Container;

  // Singletons: Repositories
  public readonly authRepo: AuthRepository;
  public readonly usersRepo: UsersRepository;
  public readonly socialAccountsRepo: SocialAccountsRepository;
  public readonly postsRepo: PostsRepository;
  public readonly billingRepo: BillingRepository;
  public readonly mediaRepo: MediaRepository;
  public readonly notificationsRepo: NotificationsRepository;

  // Singletons: Payment Gateway Providers
  public readonly cashfreeProvider: CashfreeProvider;
  public readonly razorpayProvider: RazorpayProvider;

  // Singletons: Domain Services
  public readonly authService: AuthService;
  public readonly usersService: UsersService;
  public readonly socialAccountsService: SocialAccountsService;
  public readonly postsService: PostsService;
  public readonly billingService: BillingService;
  public readonly mediaService: MediaService;
  public readonly notificationsService: NotificationsService;
  public readonly aiContentService: AiContentService;
  public readonly dataRetentionService: DataRetentionService;
  public readonly auditLogService: AuditLogService;

  private constructor() {
    // 1. Initialize Repositories (Data Access Layer)
    this.authRepo = new AuthRepository();
    this.usersRepo = new UsersRepository();
    this.socialAccountsRepo = new SocialAccountsRepository();
    this.postsRepo = new PostsRepository();
    this.billingRepo = new BillingRepository();
    this.mediaRepo = new MediaRepository();
    this.notificationsRepo = new NotificationsRepository();

    // 2. Initialize Providers (Integration Layer)
    this.cashfreeProvider = new CashfreeProvider();
    this.razorpayProvider = new RazorpayProvider();

    // 3. Initialize Domain Services with Injected Singletons
    this.authService = new AuthService();
    this.usersService = new UsersService();
    this.socialAccountsService = new SocialAccountsService();
    this.postsService = new PostsService();
    this.billingService = new BillingService();
    this.mediaService = new MediaService();
    this.notificationsService = new NotificationsService();
    this.aiContentService = new AiContentService();
    this.dataRetentionService = DataRetentionService.getInstance();
    this.auditLogService = AuditLogService.getInstance();
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
}

// Export pre-initialized singleton container and individual singletons
export const container = Container.getInstance();

export const authService = container.authService;
export const usersService = container.usersService;
export const postsService = container.postsService;
export const socialAccountsService = container.socialAccountsService;
export const billingService = container.billingService;
export const mediaService = container.mediaService;
export const notificationsService = container.notificationsService;
export const aiContentService = container.aiContentService;
export const dataRetentionService = container.dataRetentionService;
export const auditLogService = container.auditLogService;
