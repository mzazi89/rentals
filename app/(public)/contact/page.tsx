import { Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/layout";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact us",
  description: "Get in touch with the RentHub team.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Contact us</h1>
      <p className="mt-2 text-muted-foreground">
        Questions, feedback or need help with your account? We're here for you.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <Mail className="size-5 text-primary" />
            <h2 className="mt-2 font-semibold">Email</h2>
            <p className="mt-1 text-sm text-muted-foreground">hello@renthub.co.ke</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Phone className="size-5 text-primary" />
            <h2 className="mt-2 font-semibold">Phone</h2>
            <p className="mt-1 text-sm text-muted-foreground">+254 700 000 000</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <MapPin className="size-5 text-primary" />
            <h2 className="mt-2 font-semibold">Office</h2>
            <p className="mt-1 text-sm text-muted-foreground">Nairobi, Kenya</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="font-semibold">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your email app to reach our support team directly.
          </p>
          <a
            href="mailto:support@renthub.co.ke?subject=RentHub%20support%20request"
            className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Email support
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
