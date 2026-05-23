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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const departments = useQuery(api.departments.list);
  const courses = useQuery(api.subjects.list, {});
  const createDept = useMutation(api.departments.create);
  const updateDept = useMutation(api.departments.update);
  const removeDept = useMutation(api.departments.remove);
  const toggleVisibility = useMutation(api.departments.toggleVisibility);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"departments"> | null>(null);
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState<Id<"departments"> | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }
    try {
      if (editingId) {
        await updateDept({ id: editingId, name: name.trim() });
        toast.success("Department updated");
      } else {
        await createDept({ name: name.trim() });
        toast.success("Department created");
      }
      setFormOpen(false);
      setEditingId(null);
      setName("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (dept: { _id: Id<"departments">; name: string }) => {
    setEditingId(dept._id);
    setName(dept.name);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeDept({ id: deleteId });
      toast.success("Department deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
    setDeleteId(null);
  };

  const getCourseCount = (deptId: Id<"departments">) => {
    return courses?.filter((c: any) => c.departmentId === deptId).length ?? 0;
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage your departments"
        action={
          <Button
            onClick={() => {
              setEditingId(null);
              setName("");
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        }
      />

      {!departments ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments yet"
          description="Create your first department to get started"
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Applicable to Students</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept._id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{getCourseCount(dept._id)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={dept.visibleToStudents ?? true}
                      onCheckedChange={() => toggleVisibility({ id: dept._id })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(dept)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(dept._id)}
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
              {editingId ? "Edit Department" : "Add Department"}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Department name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
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
        title="Delete Department"
        description="This will permanently delete this department. This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />
    </div>
  );
}
