function Notice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <div class="overflow-hidden leading-normal rounded-lg w-fit" role="alert">
        <p class="px-4 py-3 font-bold text-orange-100 bg-orange-800">{title}</p>
        <p class="px-4 py-3 text-orange-700 bg-orange-100 ">{description}</p>
      </div>
    </>
  );
}

export { Notice };
