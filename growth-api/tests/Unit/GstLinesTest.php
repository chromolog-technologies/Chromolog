<?php

declare(strict_types=1);

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/** GST maths on invoice lines. The portal's editor is tested against the same cases (portal/src/lib/gst.test.js). */
final class GstLinesTest extends TestCase
{
    public static function cases(): iterable
    {
        $cases = json_decode((string) file_get_contents(__DIR__ . '/../fixtures/gst-cases.json'), true, flags: JSON_THROW_ON_ERROR);
        foreach ($cases as $c) {
            yield $c['name'] => [$c];
        }
    }

    #[DataProvider('cases')]
    public function testMatchesSharedCase(array $c): void
    {
        $items = array_map(fn ($it) => $it + ['description' => 'Service'], $c['items']);
        $result = gst_lines(['items' => $items], ['supply_type' => $c['supply_type'], 'reverse_charge' => $c['reverse_charge'] ? 1 : 0]);
        $t = $result['totals'];
        $this->assertEqualsWithDelta($c['expect'], [
            'taxable' => $t['taxable_value'], 'cgst' => $t['cgst'], 'sgst' => $t['sgst'],
            'igst' => $t['igst'], 'tax' => $t['tax_total'], 'total' => $t['total'],
        ], 0.0001);
    }

    public function testRejectsGstAbove28Percent(): void
    {
        $this->expectException(ApiError::class);
        gst_lines(['items' => [['description' => 'X', 'quantity' => 1, 'unit_price' => 100, 'gst_rate' => 30]]], ['supply_type' => 'intra', 'reverse_charge' => 0]);
    }

    public function testRejectsAnInvoiceWithNoLines(): void
    {
        $this->expectException(ApiError::class);
        gst_lines(['items' => [['description' => '', 'quantity' => 1, 'unit_price' => 100]]], ['supply_type' => 'intra', 'reverse_charge' => 0]);
    }

    public function testRejectsNegativeQuantity(): void
    {
        $this->expectException(ApiError::class);
        gst_lines(['items' => [['description' => 'X', 'quantity' => -1, 'unit_price' => 100]]], ['supply_type' => 'intra', 'reverse_charge' => 0]);
    }
}
