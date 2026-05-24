"use client";

import { useQuery } from "convex/react";
import { useApiMutation } from "@/hooks/useApiMutation";
import { api } from "../../../../../convex/_generated/api";
import { useTeacherAuth } from "@/providers/TeacherAuthProvider";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MessageSquare } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function BatchRequestsPage() {
  const { loading } = useTeacherAuth();
  const createRequest = useApiMutation(api.batchChangeRequests.create);

  const requests = useQuery(api.teacherPortal.getMyBatchRequests, {});

  const [formOpen, setFormOpen] = useState(false);
  const [requestType, setRequestType] = useState<string>("reschedule");
  const [description, setDescription] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    setSubmitting(true);
    try {
      let proposedTimestamp: number | undefined;
      if (proposedDate && proposedTime) {
        proposedTimestamp = new Date(
          `${proposedDate}T${proposedTime}`
        ).getTime();
      }

      await createRequest({
        requestType: requestType as any,
        description: description.trim(),
        proposedDate: proposedTimestamp,
      });
      toast.success("Request submitted");
      setFormOpen(false);
      setDescription("");
      setProposedDate("");
      setProposedTime("");
    } catch {
      // Error toast handled by useApiMutation
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch Requests"
        description="Request schedule changes"
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6 space-y-4 max-h-[600px] overflow-y-auto">
          {!requests ? (
            <Skeleton className="h-64" />
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No batch requests yet
              </p>
            </div>
          ) : (
            requests.map((req: any) => (
              <div key={req._id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{req.requestType}</Badge>
                  <Badge
                    variant={
                      req.status === "approved"
                        ? "default"
                        : req.status === "declined"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {req.status}
                  </Badge>
                </div>
                <p className="text-sm">{req.description}</p>
                {req.proposedDate && (
                  <p className="text-xs text-muted-foreground">
                    Proposed:{" "}
                    {format(new Date(req.proposedDate), "MMM d, yyyy h:mm a")}
                  </p>
                )}
                {req.adminComment && (
                  <div className="bg-muted p-2 rounded text-sm">
                    <span className="text-muted-foreground">Admin: </span>
                    {req.adminComment}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Submitted {format(new Date(req.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Batch Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Request Type</Label>
              <Select
                value={requestType}
                onValueChange={(v) => setRequestType(v ?? "reschedule")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reschedule">Reschedule</SelectItem>
                  <SelectItem value="cancel">Cancel</SelectItem>
                  <SelectItem value="substitute">Substitute</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your request..."
                rows={3}
              />
            </div>
            {requestType === "reschedule" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proposed Date</Label>
                  <Input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proposed Time</Label>
                  <Input
                    type="time"
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
