
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface InviteEmailProps {
    invitedByUsername?: string;
    teamName?: string;
    inviteLink?: string;
}

export const InviteEmail = ({
    invitedByUsername = "Admin",
    teamName = "InPsyq Team",
    inviteLink = "https://inpsyq.com/signup",
}: InviteEmailProps) => {
    const previewText = `Join ${teamName} on InPsyq`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                                Join <strong>{teamName}</strong> on <strong>InPsyq</strong>
                            </Heading>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Hello there,
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                <strong>{invitedByUsername}</strong> has invited you to join the <strong>{teamName}</strong> team on InPsyq.
                            </Text>
                            <Section className="text-center mt-[32px] mb-[32px]">
                                <Link
                                    className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                    href={inviteLink}
                                >
                                    Join the Team
                                </Link>
                            </Section>
                            <Text className="text-black text-[14px] leading-[24px]">
                                or copy and paste this URL into your browser:{" "}
                                <Link href={inviteLink} className="text-blue-600 no-underline">
                                    {inviteLink}
                                </Link>
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default InviteEmail;
