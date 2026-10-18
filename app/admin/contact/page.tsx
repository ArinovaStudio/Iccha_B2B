import ContactManager from "@/components/admin/ContactManager";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminContactPage() {
  return (
    <main className="mx-auto max-w-8xl p-6">
            <AdminSidebar activeTab="contact" />
      <ContactManager />
    </main>
  );
}