import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <p className="font-handwritten text-3xl text-primary mb-2">
          A blank page
        </p>
        <h1 className="font-serif text-4xl">Nothing’s written here.</h1>
        <p className="text-muted-foreground mt-3">
          The page you’re looking for doesn’t exist — or maybe it was never
          written.
        </p>
        <Link href="/">
          <Button className="mt-6">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
