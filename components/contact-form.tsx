"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Mail, Phone } from "lucide-react";
import emailjs from "@emailjs/browser";
import { toast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  title: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  const form = useForm<FormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      message: "",
    },
  });

  const onSubmit = async () => {
    if (!formRef.current) return;
    setIsSubmitting(true);

    try {
      const response = await emailjs.sendForm(
        "gmail",
        "serenity",
        formRef.current,
        "RBRNuIT6w-dspCo5J",
      );

      if (response.status === 200) {
        toast({
          title: "Message sent successfully!",
          description: "We'll get back to you within 24 hours.",
          variant: "default",
        });
        form.reset();
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error sending message",
        description: "Please try again later or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left Column - Contact Information */}
        <div className="space-y-10 lg:sticky lg:top-24">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[0.95] mb-4">
              <span className="font-serif italic">
                Let&apos;s discuss your{" "}
              </span>
              <br />
              <span className="text-muted-foreground/80">
                property&apos;s needs
              </span>
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed max-w-md">
              Get in touch with us to learn how we can help streamline your
              operations and boost efficiency.
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="mailto:chrysayita@gmail.com"
              className="group flex items-center gap-4 p-4 rounded-xl border border-border/60 hover:border-foreground/15 transition-all duration-300"
            >
              <div className="size-11 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">Email Us</h3>
                <p className="text-sm text-muted-foreground">
                  support@newhorizn.com
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </a>

            <a
              href="tel:+233204255719"
              className="group flex items-center gap-4 p-4 rounded-xl border border-border/60 hover:border-foreground/15 transition-all duration-300"
            >
              <div className="size-11 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">Call Us</h3>
                <p className="text-sm text-muted-foreground">
                  +233 50 428 8305
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </a>
          </div>
        </div>

        {/* Right Column - Contact Form */}
        <div className="w-full hidden lg:block">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5 p-7 md:p-9 rounded-2xl border border-border/60 bg-background"
              ref={formRef}
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your name"
                            className="h-11 rounded-lg border-border/60 focus:border-foreground/30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            className="h-11 rounded-lg border-border/60 focus:border-foreground/30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Subject
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="What is this about?"
                          className="h-11 rounded-lg border-border/60 focus:border-foreground/30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Message
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us how we can help..."
                          className="min-h-35 resize-none rounded-lg border-border/60 focus:border-foreground/30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold transition-all duration-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Send Message
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
