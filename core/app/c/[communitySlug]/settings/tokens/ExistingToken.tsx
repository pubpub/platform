import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from 'ui/accordion';
import { InfoButton } from 'ui/info-button';
import { Card, CardContent, CardFooter } from 'ui/card';
import { cn } from 'utils';

import type { SafeApiAccessToken } from '~/lib/server/apiAccessTokens';
import { UserAvatar } from '~/app/components/UserAvatar';
import {
  formatDateAsMonthDayYear,
  formatDateAsPossiblyDistance,
} from '~/lib/dates';
import { RevokeTokenButton } from './RevokeTokenButton';

export const ExistingToken = ({
  token,
  className,
}: {
  token: SafeApiAccessToken;
  className?: string;
}) => {
  const now = new Date();
  const expirationDate = new Date(token.expiration);
  const isExpired = expirationDate < now;

  return (
    <Card className={cn('p-4 pb-1', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {token.issuedBy && <UserAvatar user={token.issuedBy} />}
          <div className="flex-1">
            <h3 className="text-base font-semibold">{token.name}</h3>
            {token.description && (
              <p className="text-sm text-muted-foreground">
                {token.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className={isExpired ? 'text-red-600' : ''}>
                  {isExpired ? 'Expired' : 'Expires'}
                </span>
                <time
                  dateTime={expirationDate.toISOString()}
                  className={isExpired ? 'text-red-600' : ''}
                >
                  {formatDateAsMonthDayYear(expirationDate)}
                </time>
              </div>
              •
              <div className="flex items-center gap-1">
                <span>Created</span>
                <time dateTime={new Date(token.issuedAt).toISOString()}>
                  {formatDateAsPossiblyDistance(new Date(token.issuedAt))}
                </time>
              </div>
            </div>
          </div>
        </div>
        {token.isSiteBuilderToken ? (
          <InfoButton>
            <p>
              This token is a site builder token. It has read-only access to all
              content in the community. It cannot be revoked.
            </p>
          </InfoButton>
        ) : (
          <RevokeTokenButton token={token} />
        )}
      </div>
      <Accordion type="single" collapsible className="ml-10">
        <AccordionItem value="permissions" className="border-b-0">
          <AccordionTrigger className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            Permissions
          </AccordionTrigger>
          <AccordionContent>
            <p>
              {token.permissions
                ?.map(
                  (permission) =>
                    `${permission.scope}: ${permission.accessType} ${permission.constraints ? JSON.stringify(permission.constraints) : ''}`
                )
                .join(', ')}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
