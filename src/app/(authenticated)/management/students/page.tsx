"use client";

import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import PaginationControls from "@/components/shared/PaginationControls";
import MultiSelect from "@/components/shared/MultiSelect";
import DatePicker from "@/components/shared/DatePicker";
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
import { GraduationCap, Plus, Pencil, Trash2, Info, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { GMAIL_REGEX, REGIONS, TIMEZONES, PAGE_SIZE, COUNTRY_CODES } from "@/lib/constants";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const router = useRouter();
  const allSubjects = useQuery(api.subjects.list, {});
  const visibleSubjects = useQuery(api.subjects.listForStudents);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterTimezone, setFilterTimezone] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterRegion, filterTimezone]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.students.list,
    {
      searchQuery: debouncedSearch || undefined,
      region: filterRegion !== "all" ? filterRegion : undefined,
      timezone: filterTimezone !== "all" ? filterTimezone : undefined,
    },
    { initialNumItems: PAGE_SIZE }
  );

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
  const [editingId, setEditingId] = useState<Id<"students"> | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [timezone, setTimezone] = useState("");
  const [formSubjectIds, setFormCourseIds] = useState<string[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<
    { subjectId: string; staffId: string; meetingLink: string }[]
  >([]);
  const [classesPerPackage, setClassesPerPackage] = useState<number>(10);
  const [packageStartDate, setPackageStartDate] = useState("");
  const [deleteId, setDeleteId] = useState<Id<"students"> | null>(null);

  const createStudent = useMutation(api.students.create);
  const updateStudent = useMutation(api.students.update);
  const removeStudent = useMutation(api.students.remove);

  const resetForm = () => {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setRegion("");
    setTimezone("");
    setFormCourseIds([]);
    setTeacherAssignments([]);
    setClassesPerPackage(10);
    setPackageStartDate("");
  };

  // When courses change, update teacher assignments
  useEffect(() => {
    setTeacherAssignments((prev) => {
      const existing = new Map(
        prev.map((a) => [a.subjectId, { staffId: a.staffId, meetingLink: a.meetingLink }])
      );
      return formSubjectIds.map((cid) => ({
        subjectId: cid,
        staffId: existing.get(cid)?.staffId ?? "",
        meetingLink: existing.get(cid)?.meetingLink ?? "",
      }));
    });
  }, [formSubjectIds]);

  const handleSubmit = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !region ||
      !timezone
    ) {
      toast.error("All required fields must be filled");
      return;
    }
    if (!GMAIL_REGEX.test(email)) {
      toast.error("Only Gmail accounts are accepted");
      return;
    }
    const validAssignments = teacherAssignments.filter((a) => a.staffId);
    try {
      const data = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        subjectIds: formSubjectIds as Id<"subjects">[],
        region,
        timezone,
        teacherAssignments: validAssignments.map((a) => ({
          subjectId: a.subjectId as Id<"subjects">,
          staffId: a.staffId as Id<"staff">,
          meetingLink: a.meetingLink || undefined,
        })),
        classesPerPackage,
        packageStartDate: packageStartDate
          ? new Date(packageStartDate).getTime()
          : undefined,
      };
      if (editingId) {
        await updateStudent({ ...data, id: editingId });
        toast.success("Student updated");
      } else {
        await createStudent(data);
        toast.success("Student created");
      }
      setFormOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (student: any) => {
    setEditingId(student._id);
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setEmail(student.email);
    setPhone(student.phone ?? "");
    setRegion(student.region);
    setTimezone(student.timezone);
    setFormCourseIds(student.subjectIds);
    setTeacherAssignments(
      student.teacherAssignments.map((ta: any) => ({
        subjectId: ta.subjectId,
        staffId: ta.staffId,
        meetingLink: ta.meetingLink ?? "",
      }))
    );
    setClassesPerPackage(student.classesPerPackage);
    setPackageStartDate(
      student.packageStartDate
        ? new Date(student.packageStartDate).toISOString().split("T")[0]
        : ""
    );
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeStudent({ id: deleteId });
      toast.success("Student removed");
    } catch (err: any) {
      toast.error(err.message);
    }
    setDeleteId(null);
  };

  const getSubjectNames = (ids: string[]) =>
    allSubjects?.filter((c: any) => ids.includes(c._id)).map((c: any) => c.name) ?? [];

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage your students"
        action={
          <Button
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Student
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
        <Select value={filterRegion} onValueChange={(v) => setFilterRegion(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTimezone} onValueChange={(v) => setFilterTimezone(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Timezones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Timezones</SelectItem>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(searchQuery || filterRegion !== "all" || filterTimezone !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilterRegion("all");
              setFilterTimezone("all");
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      {!allSubjects ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : pageResults.length === 0 && status !== "LoadingMore" ? (
        <EmptyState
          icon={GraduationCap}
          title="No students found"
          description={
            searchQuery || filterRegion !== "all" || filterTimezone !== "all"
              ? "Try adjusting your filters"
              : "Add your first student"
          }
        />
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageResults.map((student) => (
                  <TableRow
                    key={student._id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/management/students/${student._id}`)}
                  >
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getSubjectNames(student.subjectIds).map((name: any) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{student.region}</TableCell>
                    <TableCell className="text-sm">{student.timezone}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {student.classesCompleted}/{student.classesPerPackage}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(student)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(student._id)}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Student" : "Add Student"}
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
                <Select
                  value={phone.startsWith("+") ? phone.split(" ")[0] : ""}
                  onValueChange={(code) => {
                    const number = phone.includes(" ")
                      ? phone.split(" ").slice(1).join(" ")
                      : phone.startsWith("+") ? "" : phone;
                    setPhone(code ? `${code} ${number}` : number);
                  }}
                >
                  <SelectTrigger className="w-28 shrink-0">
                    <SelectValue placeholder="Code">
                      {(value: string) => {
                        if (!value) return "Code";
                        return COUNTRY_CODES.find((c) => c.code === value)?.label ?? value;
                      }}
                    </SelectValue>
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
                  value={phone.includes(" ") ? phone.split(" ").slice(1).join(" ") : (phone.startsWith("+") ? "" : phone)}
                  onChange={(e) => {
                    const code = phone.startsWith("+") ? phone.split(" ")[0] : "";
                    setPhone(code ? `${code} ${e.target.value}` : e.target.value);
                  }}
                  placeholder="Phone number"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Courses</Label>
              <MultiSelect
                options={
                  visibleSubjects?.map((c: any) => ({
                    value: c._id,
                    label: c.name,
                  })) ?? []
                }
                selected={formSubjectIds}
                onChange={setFormCourseIds}
                placeholder="Select courses..."
              />
            </div>
            {/* Teacher Assignments */}
            {teacherAssignments.length > 0 && (
              <div className="space-y-3">
                <Label>Teacher Assignments</Label>
                {teacherAssignments.map((ta) => {
                  const subjectName =
                    allSubjects?.find((c: any) => c._id === ta.subjectId)?.name ?? "";
                  return (
                    <TeacherAssignmentRow
                      key={ta.subjectId}
                      subjectName={subjectName}
                      subjectId={ta.subjectId as Id<"subjects">}
                      staffId={ta.staffId}
                      meetingLink={ta.meetingLink}
                      onStaffChange={(staffId) =>
                        setTeacherAssignments((prev) =>
                          prev.map((a) =>
                            a.subjectId === ta.subjectId
                              ? { ...a, staffId }
                              : a
                          )
                        )
                      }
                      onLinkChange={(meetingLink) =>
                        setTeacherAssignments((prev) =>
                          prev.map((a) =>
                            a.subjectId === ta.subjectId
                              ? { ...a, meetingLink }
                              : a
                          )
                        )
                      }
                    />
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={region} onValueChange={(v) => setRegion(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={(v) => setTimezone(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Classes per Package</Label>
              <Input
                type="number"
                min={1}
                value={classesPerPackage}
                onChange={(e) => setClassesPerPackage(Number(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Package Start Date</Label>
                <DatePicker
                  value={packageStartDate}
                  onChange={setPackageStartDate}
                  placeholder="Start date"
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
        title="Remove Student"
        description="This will deactivate this student. Are you sure?"
        onConfirm={handleDelete}
        confirmLabel="Remove"
      />
    </div>
  );
}

// Sub-component for teacher assignment per course
function TeacherAssignmentRow({
  subjectName,
  subjectId,
  staffId,
  meetingLink,
  onStaffChange,
  onLinkChange,
}: {
  subjectName: string;
  subjectId: Id<"subjects">;
  staffId: string;
  meetingLink: string;
  onStaffChange: (staffId: string) => void;
  onLinkChange: (meetingLink: string) => void;
}) {
  const teachers = useQuery(api.staff.getByCourse, { subjectId });

  return (
    <div className="space-y-2 border rounded-md p-3">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="shrink-0">
          {subjectName}
        </Badge>
        <Select value={staffId} onValueChange={(v) => v && onStaffChange(v)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Assign teacher">
              {(value: string) => {
                if (!value) return "Assign teacher";
                const teacher = teachers?.find((t) => t._id === value);
                return teacher ? `${teacher.firstName} ${teacher.lastName}` : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {teachers?.map((t) => (
              <SelectItem key={t._id} value={t._id}>
                {t.firstName} {t.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        value={meetingLink}
        onChange={(e) => onLinkChange(e.target.value)}
        placeholder="Meeting link for this course..."
        className="text-sm"
      />
    </div>
  );
}
