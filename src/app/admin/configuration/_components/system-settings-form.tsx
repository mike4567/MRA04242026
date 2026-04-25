"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

export function SystemSettingsForm() {
    const { toast } = useToast();
    const form = useForm();

    function onSubmit(data: any) {
        console.log(data);
        toast({
            title: "System Settings Updated",
            description: "The system settings have been updated.",
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="some-setting"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Some Setting</FormLabel>
                            <FormControl>
                                <Input placeholder="Some setting value" {...field} />
                            </FormControl>
                            <FormDescription>
                                This is a description of the setting.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Update Settings</Button>
            </form>
        </Form>
    );
}
