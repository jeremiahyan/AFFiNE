import type {
  CreateCheckoutSessionInput,
  SubscriptionPlan,
  SubscriptionRecurring,
} from '@affine/graphql';
import {
  cancelSubscriptionMutation,
  createCheckoutSessionMutation,
  pricesQuery,
  resumeSubscriptionMutation,
  subscriptionQuery,
  updateSubscriptionMutation,
} from '@affine/graphql';
import type { GlobalCacheService } from '@toeverything/infra';
import { Store } from '@toeverything/infra';

import type { SubscriptionType } from '../entities/subscription';
import type { GraphQLService } from '../services/graphql';

const SUBSCRIPTION_CACHE_KEY = 'subscription:';

export class SubscriptionStore extends Store {
  constructor(
    private readonly gqlService: GraphQLService,
    private readonly globalCacheService: GlobalCacheService
  ) {
    super();
  }

  async fetchSubscriptions(abortSignal?: AbortSignal) {
    const data = await this.gqlService.gql({
      query: subscriptionQuery,
      context: {
        signal: abortSignal,
      },
    });

    if (!data.currentUser) {
      throw new Error('No logged in');
    }

    return {
      userId: data.currentUser?.id,
      subscriptions: data.currentUser?.subscriptions,
    };
  }

  async mutateResumeSubscription(
    idempotencyKey: string,
    plan?: SubscriptionPlan,
    abortSignal?: AbortSignal
  ) {
    const data = await this.gqlService.gql({
      query: resumeSubscriptionMutation,
      variables: {
        idempotencyKey,
        plan,
      },
      context: {
        signal: abortSignal,
      },
    });
    return data.resumeSubscription;
  }

  async mutateCancelSubscription(
    idempotencyKey: string,
    plan?: SubscriptionPlan,
    abortSignal?: AbortSignal
  ) {
    const data = await this.gqlService.gql({
      query: cancelSubscriptionMutation,
      variables: {
        idempotencyKey,
        plan,
      },
      context: {
        signal: abortSignal,
      },
    });
    return data.cancelSubscription;
  }

  getCachedSubscriptions(userId: string) {
    return this.globalCacheService.globalCache.get<SubscriptionType[]>(
      SUBSCRIPTION_CACHE_KEY + userId
    );
  }

  setCachedSubscriptions(userId: string, subscriptions: SubscriptionType[]) {
    return this.globalCacheService.globalCache.set(
      SUBSCRIPTION_CACHE_KEY + userId,
      subscriptions
    );
  }

  setSubscriptionRecurring(
    idempotencyKey: string,
    recurring: SubscriptionRecurring,
    plan?: SubscriptionPlan
  ) {
    return this.gqlService.gql({
      query: updateSubscriptionMutation,
      variables: {
        idempotencyKey,
        plan,
        recurring,
      },
    });
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput) {
    const data = await this.gqlService.gql({
      query: createCheckoutSessionMutation,
      variables: { input },
    });
    return data.createCheckoutSession;
  }

  async fetchSubscriptionPrices(abortSignal?: AbortSignal) {
    const data = await this.gqlService.gql({
      query: pricesQuery,
      context: {
        signal: abortSignal,
      },
    });

    return data.prices;
  }
}
