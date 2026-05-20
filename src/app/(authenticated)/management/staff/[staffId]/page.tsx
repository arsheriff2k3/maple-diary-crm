"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, Building2, BookOpen } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function StaffDetailPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = use(params);
  const staff = useQuery(api.staff.getById, {
    id: staffId as Id<"staff">,
  });

  if (staff === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <p>Staff member not found</p>
        <Link href="/management/staff" className={buttonVariants({ variant: "link" })}>
          Back to Staff
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/management/staff" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {staff.photoUrl && <AvatarImage src={staff.photoUrl} />}
              <AvatarFallback className="text-lg">
                {staff.firstName[0]}
                {staff.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {staff.firstName} {staff.lastName}
              </CardTitle>
              <p className="text-muted-foreground">{staff.departmentName}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p>{staff.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p>{staff.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p>{staff.departmentName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Subjects</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {staff.subjects.map((s) => (
                    <Badge key={s._id} variant="secondary">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
