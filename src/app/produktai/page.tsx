import { permanentRedirect } from "next/navigation";

// Pluginai dabar rodomi pagrindiniame puslapyje — senos nuorodos veda ten
export default function ProduktaiPage() {
  permanentRedirect("/#pluginai");
}
