import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { type Gig } from '../../types';

interface GigEmailProps {
  gig: Gig;
  baseUrl: string;
}

export const GigInviteEmail = ({ gig, baseUrl }: GigEmailProps) => {
  const gigUrl = `${baseUrl}/gigs/${gig.id}`;

  return (
    <Html>
      <Head />
      <Preview>Gig Details for {gig.name}</Preview>
      <Body style={{ fontFamily: 'system-ui' }}>
        <Container>
          <Section>
            <Text>You have been invited to a gig:</Text>
            <Text>
              {gig.name} on {new Date(gig.date).toLocaleDateString()}
            </Text>
            <Button
              href={gigUrl}
              style={{
                backgroundColor: '#4F46E5',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: '4px',
              }}
            >
              View Gig Details
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}; 