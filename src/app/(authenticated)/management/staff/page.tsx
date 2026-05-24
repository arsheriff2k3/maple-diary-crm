"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { useApiMutation, useApiAction } from "@/hooks/useApiMutation";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import PaginationControls from "@/components/shared/PaginationControls";
import MultiSelect from "@/components/shared/MultiSelect";
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
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users, Plus, Pencil, Trash2, Info, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { GMAIL_REGEX, PAGE_SIZE, COUNTRY_CODES } from "@/lib/constants";
import { useRouter } from "next/navigation";

export default function StaffPage() {
  const router = useRouter();
  const departments = useQuery(api.departments.list);
  const allSubjects = useQuery(api.subjects.list, {});

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterDept]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.staff.list,
    {
      searchQuery: debouncedSearch || undefined,
      departmentId:
        filterDept !== "all"
          ? (filterDept as Id<"departments">)
          : undefined,
    },
    { initialNumItems: PAGE_SIZE }
  );

  // Load more when user navigates to a page beyond what's loaded
  useEffect(() => {
    const needed = PAGE_SIZE * currentPage;
    if (results.length < needed && status === "CanLoadMore") {
      loadMore(PAGE_SIZE);
    }
  }, [currentPage, results.length, status, loadMore]);

  const pageResults = results.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const hasNextPage =
    status === "CanLoadMore" || results.length > currentPage * PAGE_SIZE;
  const hasPrevPage = currentPage > 1;

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"staff"> | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [formDeptId, setFormDeptId] = useState<string>("");
  const [formSubjectIds, setFormCourseIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<Id<"staff"> | null>(null);

  const createStaff = useApiAction(api.staffActions.createWithCredentials);
  const updateStaff = useApiMutation(api.staff.update);
  const removeStaff = useApiMutation(api.staff.remove);

  const filteredCourses = useMemo(() => {
    if (!allSubjects || !formDeptId) return [];
    return allSubjects.filter((c: any) => c.departmentId === formDeptId);
  }, [allSubjects, formDeptId]);

  const resetForm = () => {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setCountryCode("+91");
    setPhone("");
    setFormDeptId("");
    setFormCourseIds([]);
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !formDeptId) {
      toast.error("All fields are required");
      return;
    }
    if (!GMAIL_REGEX.test(email)) {
      toast.error("Only Gmail accounts are accepted");
      return;
    }
    try {
      const data = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        countryCode,
        phone: phone.trim(),
        departmentId: formDeptId as Id<"departments">,
        subjectIds: formSubjectIds as Id<"subjects">[],
      };
      if (editingId) {
        await updateStaff({ ...data, id: editingId });
        toast.success("Staff updated");
      } else {
        await createStaff(data);
        toast.success("Staff created — login credentials sent to their email");
      }
      setFormOpen(false);
      resetForm();
    } catch {
      // Error toast handled by useApiMutation
    }
  };

  const handleEdit = (staff: any) => {
    setEditingId(staff._id);
    setFirstName(staff.firstName);
    setLastName(staff.lastName);
    setEmail(staff.email);
    setCountryCode(staff.countryCode ?? "+91");
    setPhone(staff.phone);
    setFormDeptId(staff.departmentId);
    setFormCourseIds(staff.subjectIds);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeStaff({ id: deleteId });
      toast.success("Staff removed");
    } catch {
      // Error toast handled by useApiMutation
    }
    setDeleteId(null);
  };

  const getDeptName = (id: string) =>
    departments?.find((d) => d._id === id)?.name ?? "";

  const getSubjectNames = (ids: string[]) =>
    allSubjects?.filter((c: any) => ids.includes(c._id)).map((c: any) => c.name) ?? [];

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage your teaching staff"
        action={
          <Button
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        <Select value={filterDept} onValueChange={(v) => setFilterDept(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Departments">
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
        {(searchQuery || filterDept !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilterDept("all");
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      {!departments || !allSubjects ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : pageResults.length === 0 && status !== "LoadingMore" ? (
        <EmptyState
          icon={Users}
          title="No staff found"
          description={
            searchQuery || filterDept !== "all"
              ? "Try adjusting your filters"
              : "Add your first staff member"
          }
        />
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageResults.map((staff) => (
                  <TableRow
                    key={staff._id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/management/staff/${staff._id}`)}
                  >
                    <TableCell className="font-medium">
                      {staff.firstName} {staff.lastName}
                    </TableCell>
                    <TableCell>{getDeptName(staff.departmentId)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getSubjectNames(staff.subjectIds).map((name: any) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{staff.email}</TableCell>
                    <TableCell className="text-sm">{staff.phone}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(staff)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(staff._id)}
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
          <PaginationControls
            currentPage={currentPage}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onPageChange={setCurrentPage}
            isLoading={status === "LoadingMore"}
          />
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Staff" : "Add Staff"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={formDeptId}
                onValueChange={(v) => {
                  setFormDeptId(v ?? "");
                  setFormCourseIds([]);
                }}
              >
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
            <div className="space-y-2">
              <Label>Courses</Label>
              <MultiSelect
                options={filteredCourses.map((c: any) => ({
                  value: c._id,
                  label: c.name,
                }))}
                selected={formSubjectIds}
                onChange={setFormCourseIds}
                placeholder="Select courses..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Email</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Only Gmail accounts accepted</TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={(v) => v && setCountryCode(v)}>
                  <SelectTrigger className="w-28 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="flex-1"
                />
              </div>
            </div>
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Remove Staff"
        description="This will deactivate this staff member. Are you sure?"
        onConfirm={handleDelete}
        confirmLabel="Remove"
      />
    </div>
  );
}
