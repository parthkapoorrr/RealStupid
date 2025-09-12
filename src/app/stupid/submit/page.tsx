import SubmitForm from '@/components/SubmitForm';

export default function SubmitStupidPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6 border-b pb-4 border-search-ring/50 text-search-ring">
        Create a Stupid Post
      </h1>
      <SubmitForm mode="stupid"/>
    </div>
  );
}
