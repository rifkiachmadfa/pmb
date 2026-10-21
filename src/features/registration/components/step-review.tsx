"use client";

import { useState, type ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { RegistrationDraft } from "../draft";
import {
  PARENT_ROLES,
  PARENT_ROLE_LABEL,
  parentsFieldName,
  validateParentsDraft,
  type ParentRole,
  type PersonKey,
} from "../guardian-schema";
import { validateSchoolDraft } from "../school-schema";
import { BIRTH_MONTH_OPTIONS, validateStudentDraft, type StudentDraft } from "../student-schema";

type Props = {
  draft: RegistrationDraft;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
};

type Row = [label: string, value: string];

const show = (v: string) => v.trim() || "-";

function birthDateText(s: StudentDraft) {
  const month = BIRTH_MONTH_OPTIONS.find((o) => o.value === s.birthMonth)?.label ?? "";
  return [s.birthDay, month, s.birthYear].filter(Boolean).join(" ") || "-";
}

function studentGroups(s: StudentDraft): { title: string; rows: Row[] }[] {
  const unit = (v: string, u: string) => (v.trim() ? `${v.trim()} ${u}` : "-");
  return [
    {
      title: "Identitas Siswa",
      rows: [
        ["NISN", show(s.nisn)],
        ["NIK", show(s.nik)],
        ["No. Akta Lahir", show(s.birthCertificateNumber)],
        ["No. Kartu Keluarga", show(s.familyCardNumber)],
        ["Nama Lengkap", show(s.fullName)],
        ["Jenis Kelamin", show(s.gender)],
        ["Tempat Kelahiran", show(s.birthPlace)],
        ["Tanggal Lahir", birthDateText(s)],
        ["Agama", show(s.religion)],
      ],
    },
    {
      title: "Alamat",
      rows: [
        ["Alamat", show(s.streetAddress)],
        ["RT / RW", `${show(s.rt)} / ${show(s.rw)}`],
        ["Desa/Kelurahan", show(s.village)],
        ["Kecamatan", show(s.subdistrict)],
        ["Kabupaten", show(s.regency)],
        ["Provinsi", show(s.province)],
        ["Kode Pos", show(s.postalCode)],
        ["Kewarganegaraan", show(s.citizenship)],
      ],
    },
    {
      title: "Bantuan Pendidikan (KPS dan KIP)",
      rows: [
        ["Penerima KPS", show(s.isKpsRecipient)],
        ["No. KPS", show(s.kpsNumber)],
        ["Penerima KIP", show(s.isKipRecipient)],
        ["No. KIP", show(s.kipNumber)],
        ["Nama di KIP", show(s.kipHolderName)],
      ],
    },
    {
      title: "Keluarga, Tempat Tinggal, dan Kontak",
      rows: [
        ["Anak Ke Berapa", show(s.birthOrder)],
        ["Jumlah Saudara", show(s.siblingCount)],
        ["Tinggi Badan", unit(s.heightCm, "cm")],
        ["Berat Badan", unit(s.weightKg, "kg")],
        ["Jenis Tinggal", show(s.residenceType)],
        ["Jarak Rumah", unit(s.distanceToSchoolKm, "km")],
        ["Alat Transportasi", show(s.transportMode)],
        ["No. Handphone", show(s.mobilePhone)],
        ["Telepon", show(s.landlinePhone)],
        ["Email", show(s.email)],
      ],
    },
  ];
}

const PERSON_ROWS: [PersonKey, string][] = [
  ["nik", "NIK"],
  ["fullName", "Nama Lengkap"],
  ["birthYear", "Tahun Lahir"],
  ["education", "Pendidikan"],
  ["occupation", "Pekerjaan"],
  ["income", "Penghasilan"],
  ["mobilePhone", "No. Handphone"],
];

function SectionBlock({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-4 py-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <Button variant="outline" size="sm" onClick={() => onEdit(step)}>
          Ubah<span className="sr-only"> {title}</span>
        </Button>
      </div>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="break-words text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Konfirmasi (step 5, Phase 5): full read-only summary of what will be sent, an
 * Ubah button per section, and the submit button. The server re-validates
 * everything on submit; this screen is for the applicant's own review.
 */
export function StepReview({ draft, onEdit, onSubmit, submitting }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  const studentOk = validateStudentDraft(draft.student).ok;
  const parents = validateParentsDraft(draft.guardian);
  const schoolOk = validateSchoolDraft(draft.previousSchool).ok;
  const incomplete: string[] = [];
  if (!draft.termsAccepted) incomplete.push("Ketentuan");
  if (!studentOk) incomplete.push("Data Siswa");
  if (!parents.ok) incomplete.push("Data Orang Tua / Wali");
  if (!schoolOk) incomplete.push("Data Sekolah Asal");

  const noGuardian = parents.ok && parents.data.guardian === null;
  const sc = draft.previousSchool;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground">
        Periksa seluruh data di bawah ini. Gunakan tombol Ubah untuk memperbaiki
        langkah yang salah. Setelah dikirim, data tidak dapat diubah lewat formulir ini.
      </p>

      <div className="divide-y divide-border border-y border-border">
        <SectionBlock title="Ketentuan" step={0} onEdit={onEdit}>
          <p className="text-sm font-medium">
            {draft.termsAccepted ? "Kelima ketentuan disetujui" : "Belum disetujui"}
          </p>
        </SectionBlock>

        <SectionBlock title="Data Siswa" step={1} onEdit={onEdit}>
          <div className="flex flex-col gap-6">
            {studentGroups(draft.student).map((g) => (
              <div key={g.title} className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold">{g.title}</h4>
                <Rows rows={g.rows} />
              </div>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock title="Data Orang Tua / Wali" step={2} onEdit={onEdit}>
          <div className="flex flex-col gap-6">
            {PARENT_ROLES.map((role: ParentRole) => (
              <div key={role} className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold">{PARENT_ROLE_LABEL[role]}</h4>
                {role === "guardian" && noGuardian ? (
                  <p className="text-sm font-medium">Tidak ada Wali</p>
                ) : (
                  <Rows
                    rows={PERSON_ROWS.map(([key, label]): Row => [
                      label,
                      show(draft.guardian[parentsFieldName(role, key)]),
                    ])}
                  />
                )}
              </div>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock title="Data Sekolah Asal" step={3} onEdit={onEdit}>
          <Rows
            rows={[
              ["Asal Sekolah", show(sc.schoolName)],
              ["Status Sekolah", show(sc.schoolStatus)],
              ["Alamat Sekolah", show(sc.schoolAddress)],
              ["Tahun Lulus", show(sc.graduationYear)],
              ["Jurusan", show(sc.major)],
            ]}
          />
        </SectionBlock>
      </div>

      {incomplete.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Data belum lengkap</AlertTitle>
          <AlertDescription>
            Lengkapi bagian berikut sebelum mengirim: {incomplete.join(", ")}.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-start gap-3">
        <Checkbox
          id="review-confirm"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          disabled={submitting}
        />
        <Label htmlFor="review-confirm" className="cursor-pointer font-normal leading-snug">
          Saya sudah memeriksa semua data di atas dan menyatakan data tersebut benar.
        </Label>
      </div>

      <div>
        <Button
          onClick={onSubmit}
          disabled={!confirmed || incomplete.length > 0 || submitting}
        >
          {submitting ? "Mengirim…" : "Kirim Pendaftaran"}
        </Button>
      </div>
    </div>
  );
}
