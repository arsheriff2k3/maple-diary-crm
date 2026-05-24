"use client";

import { useQuery } from "convex/react";
import { useApiMutation } from "@/hooks/useApiMutation";
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

export default function CoursesPage() {
  const departments = useQuery(api.departments.list);
  const [filterDept, setFilterDept] = useState<string>("all");
  const courses = useQuery(
    api.subjects.list,
    filterDept !== "all"
      ? { departmentId: filterDept as Id<"departments"> }
      : {}
  );
  const createCourse = useApiMutation(api.subjects.create);
  const updateCourse = useApiMutation(api.subjects.update);
  const removeCourse = useApiMutation(api.subjects.remove);

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
        await updateCourse({
          id: editingId,
          name: name.trim(),
          departmentId: departmentId as Id<"departments">,
        });
        toast.success("Course updated");
      } else {
        await createCourse({
          name: name.trim(),
          departmentId: departmentId as Id<"departments">,
        });
        toast.success("Course created");
      }
      setFormOpen(false);
      setEditingId(null);
      setName("");
      setDepartmentId("");
    } catch {
      // Error toast handled by useApiMutation
    }
  };

  const handleEdit = (course: any) => {
    setEditingId(course._id);
    setName(course.name);
    setDepartmentId(course.departmentId);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeCourse({ id: deleteId });
      toast.success("Course deleted");
    } catch {
      // Error toast handled by useApiMutation
    }
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Manage courses within departments"
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
            Add Course
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

      {!courses ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to get started"
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course: any) => (
                <TableRow key={course._id}>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{course.departmentName}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(course)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(course._id)}
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
              {editingId ? "Edit Course" : "Add Course"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Course name"
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
        title="Delete Course"
        description="This will permanently delete this course. Make sure no staff or students are assigned to it."
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />
    </div>
  );
}
