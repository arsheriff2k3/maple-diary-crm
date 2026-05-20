"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SubjectsPage() {
  const departments = useQuery(api.departments.list);
  const [filterDept, setFilterDept] = useState<string>("all");
  const subjects = useQuery(
    api.subjects.list,
    filterDept !== "all"
      ? { departmentId: filterDept as Id<"departments"> }
      : {}
  );
  const createSubject = useMutation(api.subjects.create);
  const updateSubject = useMutation(api.subjects.update);
  const removeSubject = useMutation(api.subjects.remove);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"subjects"> | null>(null);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [deleteId, setDeleteId] = useState<Id<"subjects"> | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !departmentId) {
      toast.error("Name and department are required");
      return;
    }
    try {
      if (editingId) {
        await updateSubject({
          id: editingId,
          name: name.trim(),
          departmentId: departmentId as Id<"departments">,
        });
        toast.success("Subject updated");
      } else {
        await createSubject({
          name: name.trim(),
          departmentId: departmentId as Id<"departments">,
        });
        toast.success("Subject created");
      }
      setFormOpen(false);
      setEditingId(null);
      setName("");
      setDepartmentId("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (subject: any) => {
    setEditingId(subject._id);
    setName(subject.name);
    setDepartmentId(subject.departmentId);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeSubject({ id: deleteId });
      toast.success("Subject deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Manage subjects within departments"
        action={
          <Button
            onClick={() => {
              setEditingId(null);
              setName("");
              setDepartmentId(filterDept !== "all" ? filterDept : "");
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        }
      />

      {/* Filter */}
      <div className="mb-4 flex gap-3">
        <Select value={filterDept} onValueChange={(v) => setFilterDept(v ?? "all")}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by department">
              {(value: string) => {
                if (!value || value === "all") return "All Departments";
                return departments?.find((d) => d._id === value)?.name ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments?.map((dept) => (
              <SelectItem key={dept._id} value={dept._id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!subjects ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Create your first subject to get started"
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject._id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{subject.departmentName}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(subject)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(subject._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Subject" : "Add Subject"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Subject name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select department">
                  {(value: string) => {
                    if (!value) return "Select department";
                    return departments?.find((d) => d._id === value)?.name ?? value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Subject"
        description="This will permanently delete this subject. Make sure no staff or students are assigned to it."
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />
    </div>
  );
}
