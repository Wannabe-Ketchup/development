export interface NotificationField {
  readonly name: string;
  readonly value: string;
}

export interface Notification {
  readonly title: string;
  readonly fields: readonly NotificationField[];
}
