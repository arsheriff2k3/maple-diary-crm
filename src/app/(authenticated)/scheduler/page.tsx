"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import PaginationControls from "@/components/shared/PaginationControls";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, X } from "lucide-react";
import { useState, useEffect } from "react";
import { PAGE_SIZE, REGIONS } from "@/lib/constants";
import { useRouter } from "next/navigation";

export default function SchedulerPage() {
  const router = useRouter();
  const allSubjects = useQuery(api.subjects.list, {});
  const departments = useQuery(api.students.getActiveDepartments);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterRegion, filterDepartment, filterSubject]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.students.list,
    {
      searchQuery: debouncedSearch || undefined,
      region: filterRegion !== "all" ? filterRegion : undefined,
      departmentId:
        filterDepartment !== "all"
          ? (filterDepartment as Id<"departments">)
          : undefined,
      subjectId:
        filterSubject !== "all"
          ? (filterSubject as Id<"subjects">)
          : undefined,
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

  const getSubjectNames = (ids: string[]) =>
    allSubjects?.filter((s) => ids.includes(s._id)).map((s) => s.name) ?? [];

  const hasFilters =
    searchQuery ||
    filterRegion !== "all" ||
    filterDepartment !== "all" ||
    filterSubject !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterRegion("all");
    setFilterDepartment("all");
    setFilterSubject("all");
  };

  // Only show subjects belonging to departments that have active students
  const activeDeptIds = new Set(departments?.map((d) => d._id) ?? []);
  const activeSubjects =
    allSubjects?.filter((s) => activeDeptIds.has(s.departmentId)) ?? [];

  // Further filter by selected department
  const filteredSubjectOptions =
    filterDepartment !== "all"
      ? activeSubjects.filter((s) => s.departmentId === filterDepartment)
      : activeSubjects;

  return (
    <div>
      <PageHeader
        title="Academic Scheduler"
        description="Schedule sessions and manage attendance"
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        <Select value={filterRegion} onValueChange={setFilterRegion}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Regions">
              {(value: string) => {
                if (!value || value === "all") return "All Regions";
                return value;
              }}
            </SelectValue>
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
        <Select
          value={filterDepartment}
          onValueChange={(v) => {
            setFilterDepartment(v);
            setFilterSubject("all");
          }}
        >
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
            {departments?.map((d) => (
              <SelectItem key={d._id} value={d._id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Subjects">
              {(value: string) => {
                if (!value || value === "all") return "All Subjects";
                return allSubjects?.find((s) => s._id === value)?.name ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {filteredSubjectOptions.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {!allSubjects ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : pageResults.length === 0 && status !== "LoadingMore" ? (
        <EmptyState
          icon={CalendarDays}
          title="No students found"
          description={
            hasFilters
              ? "Try adjusting your filters"
              : "Add students first in the Management section"
          }
        />
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Pending Classes</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageResults.map((student) => {
                  const remaining =
                    student.classesPerPackage - student.classesCompleted;
                  return (
                    <TableRow
                      key={student._id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/scheduler/${student._id}`)}
                    >
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getSubjectNames(student.subjectIds).map((name) => (
                            <Badge
                              key={name}
                              variant="secondary"
                              className="text-xs"
                            >
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{student.region}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            remaining <= 4 ? "destructive" : "secondary"
                          }
                        >
                          {remaining}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.classesCompleted}/{student.classesPerPackage}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
    </div>
  );
}
