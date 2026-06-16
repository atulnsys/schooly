import React, { useEffect, useState } from "react";
import { StudentDetails } from "../types";
import RegistryPageShell from "./RegistryPageShell";

interface StudentsRegistryPageProps {
  students: StudentDetails[];
  currentRole: string;
}

export default function StudentsRegistryPage({ students, currentRole }: StudentsRegistryPageProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);

  useEffect(() => {
    if (selectedStudent && !students.some((student) => student.id === selectedStudent.id)) {
      setSelectedStudent(null);
    }
  }, [students, selectedStudent]);

  return (
    <RegistryPageShell
      registryId="students"
      rows={students}
      currentRole={currentRole}
      selectedRow={selectedStudent}
      onSelectRow={setSelectedStudent}
      permissionContext={{ currentRole }}
    />
  );
}
